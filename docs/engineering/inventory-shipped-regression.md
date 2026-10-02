# Inventory shipped-history regression

The outbound persistence contract introduced `inventory_units.status = shipped`
in migration 0005. A fully consumed inventory row retains its historical quantity
instead of deleting itself or setting quantity to zero (the table requires a
positive stored quantity). The first inventory read contract omitted this state,
causing response validation failure if any shipped row was returned.

The read projection now explicitly accepts shipped history and presents its
current balance as zero. Its historical stored quantity must not be advertised
as available stock. Allocation and execution persistence are unchanged.

| Before                                                     | After                                                     | Why                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| A shipped row invalidates the whole inventory response     | Shipped zero-balance rows are valid evidence              | Terminal history must not disable the operational workspace |
| Historical consumed quantity could look like current stock | Zero balance and bilingual shipped/no-current-stock label | Preserve warehouse quantity meaning                         |

Regression coverage includes contract acceptance/rejection, actual PostgreSQL
shipped row projection, and a mixed active/shipped production-browser fixture.
This fix is staged independently from the next Loads read-model foundation.
